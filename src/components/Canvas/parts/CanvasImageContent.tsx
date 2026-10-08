import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useResourceStore } from '../../../resources/resourceStore';

type ImgView = { innerAlign?: string; scaleX?: number; scaleY?: number; pivotX?: number; pivotY?: number };

/** inner_align / scale / pivot of lv_image as CSS */
function imageViewStyle(view?: ImgView): React.CSSProperties {
  const st: React.CSSProperties = {};
  switch (view?.innerAlign) {
    case 'contain': st.backgroundSize = 'contain'; st.backgroundRepeat = 'no-repeat'; st.backgroundPosition = 'center'; break;
    case 'cover': st.backgroundSize = 'cover'; st.backgroundRepeat = 'no-repeat'; st.backgroundPosition = 'center'; break;
    case 'center': st.backgroundSize = 'auto'; st.backgroundRepeat = 'no-repeat'; st.backgroundPosition = 'center'; break;
    case 'tile': st.backgroundSize = 'auto'; st.backgroundRepeat = 'repeat'; break;
    case 'top_left': case 'default': st.backgroundSize = 'auto'; st.backgroundRepeat = 'no-repeat'; st.backgroundPosition = 'top left'; break;
    default: st.backgroundSize = '100% 100%';
  }
  const sx = (Number(view?.scaleX ?? 256) || 0) / 256;
  const sy = (Number(view?.scaleY ?? 256) || 0) / 256;
  if (sx !== 1 || sy !== 1) {
    st.transform = `scale(${sx}, ${sy})`;
    st.transformOrigin = `${Number(view?.pivotX) || 0}px ${Number(view?.pivotY) || 0}px`;
  }
  return st;
}

export const CanvasImageContent: React.FC<{ src?: string; recolor?: string; iconColor?: string; view?: ImgView }> = React.memo(({ src, recolor, iconColor, view }) => {
  const images = useResourceStore((s) => s.images);
  const matched = src
    ? images.find((img) => img.id === src || img.name === src)
    : undefined;

  if (matched) {
    // icons (and images with an explicit recolor) are painted with a color through the image's alpha mask
    const tint = recolor || (matched.originalName.startsWith('icon_') ? iconColor : undefined);
    if (tint) {
      return (
        <div
          className="lvgl-img"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: tint,
            WebkitMaskImage: `url(${matched.data})`,
            maskImage: `url(${matched.data})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            ...(view?.scaleX !== undefined || view?.scaleY !== undefined ? { transform: imageViewStyle(view).transform, transformOrigin: imageViewStyle(view).transformOrigin } : {}),
          }}
        />
      );
    }
    return (
      <div
        className="lvgl-img"
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${matched.data})`,
          ...imageViewStyle(view),
        }}
      />
    );
  }

  return (
    <div
      className="lvgl-img"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: '#94a3b8',
      }}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
    </div>
  );
});
