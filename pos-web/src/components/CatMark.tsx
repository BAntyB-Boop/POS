interface Props {
  size?: number;
  color?: string;
  className?: string;
}

// เครื่องหมายแมวเฝ้าร้าน — ใช้แทนโลโก้ตัวอักษรทั่วไป
export default function CatMark({ size = 40, color = 'currentColor', className }: Props) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path d="M80,86 C96,82 98,60 84,50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="50" cy="78" rx="34" ry="24" fill={color} />
      <circle cx="50" cy="42" r="26" fill={color} />
      <polygon points="26,32 34,6 46,30" fill={color} />
      <polygon points="54,30 66,6 74,32" fill={color} />
    </svg>
  );
}
