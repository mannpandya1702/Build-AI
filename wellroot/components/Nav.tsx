export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5 md:px-10">
        <a
          href="#hero"
          className="flex items-center gap-2 text-[19px] font-semibold tracking-tight text-ink"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3.5c-3 0-5 1.8-5 4.2 0 1.4.5 2.5.9 4 .4 1.5.3 4 .9 6 .3 1 .8 1.8 1.4 1.8.7 0 .9-1 1.1-2 .2-1 .4-2 .8-2s.6 1 .8 2c.2 1 .4 2 1.1 2 .6 0 1.1-.8 1.4-1.8.6-2 .5-4.5.9-6 .4-1.5.9-2.6.9-4 0-2.4-2-4.2-5-4.2Z"
              fill="#12b3ab"
            />
          </svg>
          Wellroot
        </a>
        <div className="flex items-center gap-2 md:gap-6">
          <a
            href="#services"
            className="hidden text-[15px] font-medium text-muted transition-colors hover:text-teal-deep sm:inline"
          >
            Care
          </a>
          <a
            href="#why"
            className="hidden text-[15px] font-medium text-muted transition-colors hover:text-teal-deep sm:inline"
          >
            Why us
          </a>
          <a href="#booking" className="btn btn-primary !min-h-[42px] !px-5">
            Book
          </a>
        </div>
      </nav>
    </header>
  );
}
