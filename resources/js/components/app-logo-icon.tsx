import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 13.5C3 8 7 3.5 12.5 3.5C14.8 3.5 19 4.2 20.5 3C20.5 4.5 21 8.5 21 11.5C21 16.8 16.5 21 11 21C6.5 21 3 17.8 3 13.5Z"
                fill="currentColor"
                fillOpacity="0.15"
            />
            <path
                d="M3 13.5C3 8 7 3.5 12.5 3.5C14.8 3.5 19 4.2 20.5 3C20.5 4.5 21 8.5 21 11.5C21 16.8 16.5 21 11 21C6.5 21 3 17.8 3 13.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 15.5L10.5 11.5L13.5 14L17.5 8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="17.5" cy="8" r="1.5" fill="currentColor" />
        </svg>
    );
}
