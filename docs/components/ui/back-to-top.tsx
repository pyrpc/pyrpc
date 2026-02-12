'use client'

import React, { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={scrollToTop}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "fixed bottom-8 right-8 z-50 p-4 border border-edge bg-background shadow-2xl",
                        "hover:bg-foreground hover:text-background transition-colors duration-300",
                        "cursor-pointer group"
                    )}
                    aria-label="Back to top"
                >
                    <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1" />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
