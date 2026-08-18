type IconProps = {
  size?: number;
  className?: string;
};

function base(paths: React.ReactNode) {
  return function Icon({ size = 16, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

export const IconCheckCircle = base(
  <>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </>,
);

export const IconXCircle = base(
  <>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path d="m9.5 9.5 5 5m0-5-5 5" />
  </>,
);

export const IconLoader = base(
  <>
    <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>,
);

export const IconGlobe = base(
  <>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path d="M3 12h18M12 3c2.4 2.5 3.6 5.6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.6-3.6-9S9.6 5.5 12 3Z" />
  </>,
);

export const IconWebhook = base(
  <>
    <path d="M7 17a3 3 0 1 1 2.83-4H16" />
    <path d="M17 7a3 3 0 1 1-2.83 4" />
    <path d="M14 20a3 3 0 1 0-1.5-5.6" />
  </>,
);

export const IconFileText = base(
  <>
    <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
    <path d="M14 3.5V8h4M9 12.5h6M9 15.5h6M9 18.5h3.5" />
  </>,
);

export const IconEdit = base(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>,
);

export const IconList = base(
  <>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </>,
);

export const IconUserCheck = base(
  <>
    <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="m16.5 12 1.8 1.8L21.5 10" />
  </>,
);

export const IconMonitor = base(
  <>
    <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
    <path d="M9 20h6M12 16.5V20" />
  </>,
);

export const IconTablet = base(
  <>
    <rect x="5" y="2.5" width="14" height="19" rx="2" />
    <path d="M12 18.5h.01" />
  </>,
);

export const IconSmartphone = base(
  <>
    <rect x="7" y="2.5" width="10" height="19" rx="2" />
    <path d="M12 18.5h.01" />
  </>,
);

export const IconMail = base(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 6.5 8 6 8-6" />
  </>,
);

export const IconMinting = base(
  <>
    <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </>,
);

export const IconExpand = base(
  <>
    <path d="M15 4h5v5M20 4l-6 6M9 20H4v-5M4 20l6-6" />
  </>,
);

export const IconSparkle = base(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8.5 13.6 12 12 15.5 10.4 12 12 8.5Z" />
  </>,
);
