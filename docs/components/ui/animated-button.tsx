'use client'

import React from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { cn } from '@/lib/cn'

type AnimatedButtonProps<T extends React.ElementType = 'button'> = {
    as?: T;
    children?: React.ReactNode;
    className?: string;
} & MotionProps & Omit<React.ComponentPropsWithoutRef<T>, keyof MotionProps | 'as' | 'children' | 'className'>;

function AnimatedButton<T extends React.ElementType = 'button'>({
    children = 'Browse Components',
    className = '',
    as,
    whileTap = { scale: 0.97 },
    transition = {
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: {
            type: 'spring',
            stiffness: 10,
            damping: 5,
            mass: 0.1,
        },
    },
    ...rest
}: AnimatedButtonProps<T>) {
    const Component = (motion as any)[as || 'button'] || motion.button

    return (
        <Component
            {...rest}
            whileTap={whileTap}
            transition={transition}
            className={cn(
                'px-6 py-2 relative overflow-hidden bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800',
                'text-neutral-900 dark:text-neutral-100 [--shine:rgba(0,0,0,.66)] dark:[--shine:rgba(255,255,255,.66)]',
                className
            )}
        >
            <motion.span
                className="tracking-wide font-light h-full w-full flex items-center justify-center relative z-10"
                style={{
                    WebkitMaskImage:
                        'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
                    maskImage:
                        'linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))',
                } as any}
                initial={{ ['--mask-x']: '100%' } as any}
                animate={{ ['--mask-x']: '-100%' } as any}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear', repeatDelay: 1 }}
            >
                {children}
            </motion.span>

            <motion.span
                className="block absolute inset-0 p-px"
                style={{
                    background: 'linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                } as any}
                initial={{ backgroundPosition: '100% 0', opacity: 0 } as any}
                animate={{ backgroundPosition: ['100% 0', '0% 0'], opacity: [0, 1, 0] } as any}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
        </Component>
    )
}

export default AnimatedButton
