export default function Footer() {
  return (
    <footer className="border-t border-line bg-white py-12">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center md:px-10">
        <div className="flex items-center gap-2 text-[18px] font-semibold text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.5c-3 0-5 1.8-5 4.2 0 1.4.5 2.5.9 4 .4 1.5.3 4 .9 6 .3 1 .8 1.8 1.4 1.8.7 0 .9-1 1.1-2 .2-1 .4-2 .8-2s.6 1 .8 2c.2 1 .4 2 1.1 2 .6 0 1.1-.8 1.4-1.8.6-2 .5-4.5.9-6 .4-1.5.9-2.6.9-4 0-2.4-2-4.2-5-4.2Z"
              fill="#12b3ab"
            />
          </svg>
          Wellroot
        </div>
        <p className="text-[14px] text-muted">
          Family &amp; cosmetic dentistry · Bengaluru
        </p>
        <p className="text-[13px] text-muted">
          © {new Date().getFullYear()} Wellroot Dental. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
