export function AnimatedCards() {
  return (
    <div className="section-wrapper-compact mt-4">
      <div className="w-full">
        <div className="border-border grid grid-cols-1 gap-0 border-t sm:grid-cols-2 lg:grid-cols-3">
          <section className="border-border bg-primary/5 group relative w-full overflow-hidden border-r">
            <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden">
              <div className="bg-primary/20 absolute inset-0"></div>
              <div className="bg-primary h-full -translate-x-full transform transition-transform duration-500 ease-out group-hover:translate-x-0"></div>
            </div>
            <div className="flex h-full flex-col p-5 pt-6 md:p-7">
              <div className="flex items-start gap-2.5">
                <div className="text-primary mt-1 h-5 w-5 shrink-0 md:h-5 md:w-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M240,56v64a8,8,0,0,1-16,0V75.31l-82.34,82.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,212.69,64H168a8,8,0,0,1,0-16h64A8,8,0,0,1,240,56Z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-primary font-mono text-sm uppercase md:text-base">
                    Multi-Theme Support
                  </h3>
                  <p className="text-muted-foreground mt-1.5 font-mono text-sm md:text-base">
                    Support for light, dark, and system themes plus custom color
                    themes with smooth animated transitions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-border bg-primary/5 group relative w-full overflow-hidden border-r">
            <div className="absolute bottom-0 left-0 top-0 w-1 overflow-hidden">
              <div className="bg-primary/20 absolute inset-0"></div>
              <div className="bg-primary h-full w-full translate-y-full transform transition-transform duration-500 ease-out group-hover:translate-y-0"></div>
            </div>
            <div className="flex h-full flex-col p-5 pt-6 md:p-7">
              <div className="flex items-start gap-2.5">
                <div className="text-primary mt-1 h-5 w-5 shrink-0 md:h-5 md:w-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M144,157.68a68,68,0,1,0-71.9,0c-20.65,6.76-39.23,19.39-54.17,37.17a8,8,0,0,0,12.25,10.3C50.25,181.19,77.91,168,108,168s57.75,13.19,77.87,37.15a8,8,0,0,0,12.25-10.3C183.18,177.07,164.6,164.44,144,157.68ZM56,100a52,52,0,1,1,52,52A52.06,52.06,0,0,1,56,100Zm197.66,33.66-32,32a8,8,0,0,1-11.32,0l-16-16a8,8,0,0,1,11.32-11.32L216,148.69l26.34-26.35a8,8,0,0,1,11.32,11.32Z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-primary font-mono text-sm uppercase md:text-base">
                    Framework Agnostic
                  </h3>
                  <p className="text-muted-foreground mt-1.5 font-mono text-sm md:text-base">
                    Works seamlessly with Next.js, Vite, and TanStack Start with
                    dedicated providers for each framework.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 group relative w-full overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden">
              <div className="bg-primary/20 pointer-events-none absolute inset-0"></div>
              <div className="bg-primary pointer-events-none z-0 h-full w-full -translate-x-full transform transition-transform duration-500 ease-out group-hover:translate-x-0"></div>
            </div>
            <div className="z-20 flex h-full flex-col p-5 pt-6 md:p-7">
              <div className="flex items-start gap-2.5">
                <div className="text-primary mt-1 h-5 w-5 shrink-0 md:h-5 md:w-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M152,96H104a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V104A8,8,0,0,0,152,96Zm-8,48H112V112h32Zm88,0H216V112h16a8,8,0,0,0,0-16H216V56a16,16,0,0,0-16-16H160V24a8,8,0,0,0-16,0V40H112V24a8,8,0,0,0-16,0V40H56A16,16,0,0,0,40,56V96H24a8,8,0,0,0,0,16H40v32H24a8,8,0,0,0,0,16H40v40a16,16,0,0,0,16,16H96v16a8,8,0,0,0,16,0V216h32v16a8,8,0,0,0,16,0V216h40a16,16,0,0,0,16-16V160h16a8,8,0,0,0,0-16Zm-32,56H56V56H200v95.87s0,.09,0,.13,0,.09,0,.13V200Z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-primary font-mono text-sm uppercase md:text-base">
                    View Transitions API
                  </h3>
                  <p className="text-muted-foreground mt-1.5 font-mono text-sm md:text-base">
                    Leverages modern View Transitions API for smooth,
                    hardware-accelerated theme animations with fallback support.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
