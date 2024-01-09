import ChatComponent from "@/components/MultipleChoice"
import Navbar from "@/components/Navbar"
import { Suspense } from "react"

export default function Mcq() {
    return(
        <>
        <Navbar />
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0a95ff] to-[#95f2fa] opacity-30 sm:left-[calc(50%-20rem)] sm:w-[72.1875rem] sm:translate-y-8"
            />
          </div>
            <div className="border-2 bg-white p-3 w-[800px] rounded">
                <h2 className="text-2xl font-bold">Multiple Choice Practice</h2>
                <ChatComponent />
            </div>
        </div>
        </main>
        </>
    )
}