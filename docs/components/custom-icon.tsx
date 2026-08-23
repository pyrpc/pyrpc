import { type LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { isValidElement, cloneElement } from 'react';
import { cn } from '@/lib/cn';
import { brandIcons as icons } from '@/components/brand-icons';

export function CustomIcon({ icon, className }: { icon: string | LucideIcon | React.ElementType | React.ReactNode; className?: string }) {
    if (!icon) return null;

    if (isValidElement(icon)) {
        return cloneElement(icon as React.ReactElement<any>, {
            className: cn((icon.props as any).className, className),
        });
    }

    if (typeof icon === 'string') {
        if (icons[icon as keyof typeof icons]) {
            const SimpleIcon = icons[icon as keyof typeof icons];
            return (
                <svg
                    role="img"
                    viewBox={SimpleIcon.viewBox ?? '0 0 24 24'}
                    width={16}
                    height={16}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className={className}
                >
                    {(Array.isArray(SimpleIcon.path) ? SimpleIcon.path : [SimpleIcon.path]).map((d, i) => (
                        <path key={i} d={d} />
                    ))}
                </svg>
            );
        }

        // Fallback to Lucide if string matches a Lucide icon
        const LucideComponent = (LucideIcons as any)[icon];
        if (LucideComponent) {
            return <LucideComponent className={className} />;
        }
    }

    if (typeof icon === 'function') {
        const Icon = icon as React.ElementType;
        return <Icon className={className} />;
    }

    return null;
}
