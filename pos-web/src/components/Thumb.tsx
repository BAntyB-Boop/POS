interface Props {
  name: string;
  img: string | null;
  size: number;
  radius: number;
  fontSize?: number;
}

// รูปสินค้า: มีรูปจริงแสดงรูป ไม่มีแสดงตัวอักษรแรกของชื่อแทน
export default function Thumb({ name, img, size, radius, fontSize }: Props) {
  if (img) {
    return (
      <div style={{ width: size, height: size, flex: 'none', borderRadius: radius, overflow: 'hidden', background: 'var(--soft)' }}>
        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, flex: 'none', borderRadius: radius, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fontSize ?? Math.round(size * 0.42), fontWeight: 700, color: 'var(--brand)' }}>
      {(name || '?').trim().charAt(0)}
    </div>
  );
}
