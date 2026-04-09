import clsx from 'clsx';
import Image from 'next/image';
import logo from '@/app/icon.png';

export function BrandLogo({
  size = 'md',
  showText = false,
  textClassName,
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textClassName?: string;
}) {
  const sizeCls =
    size === 'sm'
      ? 'w-9 h-9 text-xl'
      : size === 'lg'
        ? 'w-14 h-14 text-3xl'
        : 'w-11 h-11 text-2xl';

  return (
    <div className="flex items-center gap-3">
      <div className={clsx('relative rounded-2xl overflow-hidden flex items-center justify-center shadow-lg bg-white/10', sizeCls)}>
        <Image src={logo} alt="Spentro logo" className="w-full h-full object-cover" priority />
      </div>
      {showText && (
        <div>
          <p className={clsx('font-extrabold tracking-tight text-white', textClassName ?? 'text-lg leading-tight')}>Spentro</p>
          <p className="text-primary-300 text-xs font-medium">Admin Panel</p>
        </div>
      )}
    </div>
  );
}
