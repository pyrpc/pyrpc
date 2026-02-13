'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react'

interface RequestFlowProps {
    status: 'idle' | 'running' | 'success' | 'error'
}

export function RequestFlow({ status }: RequestFlowProps) {
    return (
        <div className="h-full flex items-center justify-center p-8 bg-muted/10 relative overflow-hidden ring-1 ring-edge">
            <div className="flex items-center gap-12 relative z-10 w-full max-w-md">
                {/* Client Side */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 border border-edge bg-background flex items-center justify-center">
                        <span className="text-[10px] font-mono font-bold">CLIENT</span>
                    </div>
                </div>

                {/* The Pipe */}
                <div className="flex-1 h-px bg-edge relative">
                    <AnimatePresence>
                        {status === 'running' && (
                            <>
                                {/* Request Particle */}
                                <motion.div
                                    initial={{ left: '0%', opacity: 0 }}
                                    animate={{ left: '100%', opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                    className="absolute -top-1 w-2 h-2 bg-foreground"
                                />
                                {/* Response Particle */}
                                <motion.div
                                    initial={{ left: '100%', opacity: 0 }}
                                    animate={{ left: '0%', opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-1 w-2 h-2 bg-green-500"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === 'running' ? (
                                <motion.div
                                    key="zap"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                >
                                    <Zap className="w-4 h-4 text-yellow-500 fill-current animate-pulse" />
                                </motion.div>
                            ) : status === 'success' ? (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-[10px] font-mono font-bold text-green-500 uppercase tracking-widest"
                                >
                                    Success
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Server Side */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 border border-edge bg-background flex items-center justify-center">
                        <span className="text-[10px] font-mono font-bold">SERVER</span>
                    </div>
                </div>
            </div>

            {/* Background Decorative Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
    )
}
