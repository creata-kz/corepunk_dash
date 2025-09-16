

import React, { useState, useEffect, useRef } from 'react';

// A simple hook to detect when an element is in view
const useInView = (options: IntersectionObserverInit = { threshold: 0.6 }) => {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        const observer = new IntersectionObserver(([entry]) => {
            // Trigger only once
            if (entry.isIntersecting) {
                setIsInView(true);
                if (element) {
                    observer.unobserve(element);
                }
            }
        }, options);

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options]);

    // FIX: Add 'as const' to ensure the hook returns a tuple with a stable type.
    // This allows TypeScript to correctly infer the individual types of 'ref' (RefObject) and 'isInView' (boolean)
    // when destructuring the array, resolving the type error on the 'ref' prop.
    return [ref, isInView] as const;
};

export const AiStrategicBrief: React.FC = () => {
    const [ref, isInView] = useInView();
    const [displayedText, setDisplayedText] = useState('');
    const fullText = `The new 'Faidens' trailer launch was a massive success, driving a <span class="font-bold text-green-400">+1200%</span> surge in social shares and a <span class="font-bold text-green-400">+25.3%</span> increase in website traffic. This marketing beat directly contributed to a <span class="font-bold text-green-400">+15%</span> rise in DAU during the campaign week.<br/><br/>However, the subsequent Server Stress Test, while successfully handling peak player counts, surfaced critical server lag issues. This is reflected in a <span class="font-bold text-brand-primary">+250%</span> increase in negative comments specifically mentioning 'lag' and 'disconnects', and a slight <span class="font-bold text-brand-primary">-2.1%</span> dip in player retention in the three days following the test. The immediate priority is to deploy infrastructure hotfixes to address server stability before the next CBT wave.`;
    const typingSpeed = 20; // ms

    useEffect(() => {
        if (isInView) {
            let i = 0;
            const interval = setInterval(() => {
                if (i < fullText.length) {
                    setDisplayedText(fullText.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                    // Remove cursor when done
                    setDisplayedText(fullText); 
                }
            }, typingSpeed);
            return () => clearInterval(interval);
        }
    }, [isInView, fullText]);
    
    // Show a cursor only while typing
    const textWithCursor = displayedText.length < fullText.length 
        ? displayedText + '<span class="inline-block w-2 h-4 bg-brand-text-secondary ml-1 animate-pulse" style="animation-duration: 0.7s;"></span>'
        : fullText;

    return (
        <div 
            ref={ref}
            className="glass-card p-4 rounded-xl text-left w-full h-full flex flex-col"
        >
            <h3 className="text-3xl font-semibold text-brand-text-primary mb-2 shrink-0">AI Strategic Brief</h3>
            
            <div className="flex-1 flex items-center justify-center min-h-[170px]">
                <p 
                    className="text-sm text-brand-text-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: isInView ? textWithCursor : '' }}
                />
            </div>
        </div>
    );
};
