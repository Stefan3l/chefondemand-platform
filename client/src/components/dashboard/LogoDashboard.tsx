import Image from "next/image"

export default function LogoDashboard() {
    return (
             <div
          className="
            relative
            px-4 py-6 h-22
            bg-gradient-to-br from-neutral-900/90 to-neutral-800/80
            before:absolute before:inset-x-0 before:top-0 before:h-[2px] lg:before:h-[3px]
            before:bg-gradient-to-r before:from-transparent before:via-[#C7AE6A] before:to-transparent
            after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] lg:after:h-[3px]
            after:bg-gradient-to-r after:from-transparent after:via-[#C7AE6A] after:to-transparent
          "
        >
          <div className='flex items-center justify-center'>
              <Image src="/logo.webp" alt="Logo" width={200} height={32} />
          </div>
        </div>
    )
}