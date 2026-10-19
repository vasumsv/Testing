interface Props {
  url: string;
}

export function WatermarkOverlay({ url }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src={url}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: '60%',
          maxWidth: '420px',
          maxHeight: '420px',
          objectFit: 'contain',
          opacity: 0.07,
          userSelect: 'none',
        }}
      />
    </div>
  );
}
