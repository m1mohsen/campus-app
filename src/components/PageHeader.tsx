// هدر رنگی یکسان برای همه‌ی ماژول‌ها
const GRADIENTS: Record<string, string> = {
  blue:   'linear-gradient(135deg, #172554, #1e40af 55%, #2563eb)',
  violet: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  green:  'linear-gradient(135deg, #14532d, #16a34a)',
  orange: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  rose:   'linear-gradient(135deg, #881337, #e11d48)',
  teal:   'linear-gradient(135deg, #134e4a, #0d9488)',
};

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  color?: keyof typeof GRADIENTS;
}

export default function PageHeader({ icon, title, subtitle, color = 'blue' }: PageHeaderProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '22px 18px 20px',
        background: GRADIENTS[color] ?? GRADIENTS.blue,
        color: '#fff',
      }}
    >
      {/* دایره‌های تزئینی */}
      <div style={{
        position: 'absolute', top: -30, left: -20, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, right: 60, width: 90, height: 90,
        borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 30, lineHeight: 1 }}>{icon}</div>
        <h1 style={{ marginTop: 10, fontSize: 21, fontWeight: 800 }}>{title}</h1>
        {subtitle && (
          <p style={{ marginTop: 6, fontSize: 13.5, opacity: 0.85, lineHeight: 1.9, maxWidth: 520 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
