"use client";

import { useEffect, useState } from "react";

export function Particles() {
    const [particles, setParticles] = useState<Array<{ id: number; left: number; size: number; duration: number; delay: number; color: string }>>([]);

    useEffect(() => {
        const colors = ["#4285F4", "#34A853", "#FBBC04", "#EA4335", "#8E44AD"];
        const newParticles = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 10 + 8,
            delay: Math.random() * 15,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle absolute rounded-full opacity-30"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `-${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}