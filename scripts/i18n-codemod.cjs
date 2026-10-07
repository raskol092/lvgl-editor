// One-off codemod: wraps Chinese UI strings in t() and collects keys.
const ts = require('typescript'); const fs = require('fs'); const path = require('path');
const CJK = /[一-鿿]/;
const root = path.resolve(__dirname, '../src');
const files = process.argv.slice(2);
const keys = new Set();
const PROPS = new Set(['label','title','description','placeholder','tooltip','message','hint','emptyText','confirmText','cancelText']);
const CALLEES = /^(toast|modal|alert|confirm|prompt|showToast|addToast|message)(\.|$)/;
const SKIP_PROPS = new Set(['value','id','key','type','category','name','text','className','icon']);

function calleeText(n){ return n.expression.getText(); }
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = []; // {start,end,text}
  const isData = file.endsWith('.ts');
  function inT(n){ let p=n.parent; return p && ts.isCallExpression(p) && p.expression.getText()==='t'; }
  function ctxOK(n){
    const p = n.parent;
    if (!p) return false;
    if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return false;
    if (ts.isCaseClause(p) || ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p) || ts.isImportDeclaration(p)) return false;
    if (ts.isJsxAttribute(p)) return !SKIP_PROPS.has(p.name.getText());
    if (ts.isPropertyAssignment(p)) return PROPS.has(p.name.getText());
    if (ts.isCallExpression(p)) { return CALLEES.test(calleeText(p)) && p.expression.getText()!=='t'; }
    if (ts.isJsxExpression(p)) return true;
    if (ts.isConditionalExpression(p) && p.condition !== n) return ctxOK(p);
    if (ts.isBinaryExpression(p) && (p.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken||p.operatorToken.kind===ts.SyntaxKind.BarBarToken||p.operatorToken.kind===ts.SyntaxKind.QuestionQuestionToken) && p.right===n) return ctxOK(p);
    if (ts.isParenthesizedExpression(p)) return ctxOK(p);
    return false;
  }
  function esc(s){ return "'" + s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n') + "'"; }
  function visit(n){
    if (ts.isJsxText(n)) {
      const txt = n.getText();
      if (CJK.test(txt)) {
        const m = txt.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const core = m[2].replace(/\s+/g,' ');
        keys.add(core);
        edits.push({start:n.getStart(), end:n.getEnd(), text: m[1] + '{t(' + esc(core) + ')}' + m[3]});
      }
      return;
    }
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && CJK.test(n.text) && !inT(n) && ctxOK(n)) {
      keys.add(n.text);
      let rep = 't(' + esc(n.text) + ')';
      if (ts.isJsxAttribute(n.parent)) rep = '{' + rep + '}';
      edits.push({start:n.getStart(), end:n.getEnd(), text: rep});
      return;
    }
    if (ts.isTemplateExpression(n) && !inT(n) && ctxOK(n)) {
      const parts=[n.head.text]; const args=[];
      n.templateSpans.forEach((s,i)=>{ parts.push('{'+i+'}'+s.literal.text); args.push(s.expression.getText()); });
      const key = parts.join('');
      if (CJK.test(key)) {
        keys.add(key);
        let rep = 't(' + esc(key) + ', ' + args.join(', ') + ')';
        if (ts.isJsxAttribute(n.parent)) rep = '{' + rep + '}';
        edits.push({start:n.getStart(), end:n.getEnd(), text: rep});
        return;
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  // JSX attribute string literal replaced inside attribute: `title="x"` -> `title={t('x')}`
  edits.sort((a,b)=>b.start-a.start);
  let out = src;
  for (const e of edits) out = out.slice(0,e.start)+e.text+out.slice(e.end);
  let rel = path.relative(path.dirname(file), path.join(root,'i18n')).replace(/\\/g,'/');
  if (!rel.startsWith('.')) rel = './'+rel;
  // insert import after last import
  const lines = out.split('\n'); let last=-1;
  for (let i=0;i<lines.length;i++){ if(/^import .* from /.test(lines[i])||/^} from /.test(lines[i])) last=i; if(/^(const|export|function|type|interface) /.test(lines[i])&&last>=0) break; }
  lines.splice(last+1,0,`import { t } from '${rel}';`);
  fs.writeFileSync(file, lines.join('\n'));
}
fs.writeFileSync(process.env.KEYS_OUT, JSON.stringify([...keys], null, 1));
console.log('keys', keys.size);
