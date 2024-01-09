import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";


export default async function Home() {
  return (
    <>
      <Navbar />
      {/* Hero */}
      <MaxWidthWrapper className="mt-10 flex flex-col items-center justify-center text-center sm:mt-12">
      <div className="px-8 py-10">
        <div className="grid gap-8 items-start justify-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <button className="relative px-7 py-4 bg-white rounded-lg leading-none flex items-center divide-x divide-gray-600">
              <span className="flex items-center space-x-5">
                <span className="pr-6 text-black">Try StudyAP out for free!</span>
              </span>
              <span className="pl-6 text-indigo-400 group-hover:text-black transition duration-200">Learn more &rarr;</span>
            </button>
          </div>
        </div>
      </div>

        <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
          Redefining AP Practice with <span className="text-blue-600">AI Solutions</span> 
        </h1>

        <p className="mt-5 max-w-prose text-lg text-zinc-700 sm:text-2xl">
        StudyAP helps AP students achieve mastery and empowers them to succeed through innovative and personalized study solutions.
        </p>

        <Link
          className={cn(
            buttonVariants({
              size: "lg",
              className: "mt-5",
            }),
            "text-lg",
          )}
          href={"/dashboard"}
        >
          Start Studying Now
        </Link>
      </MaxWidthWrapper>

      {/* Value Prop */}
      <div>
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

          <div>
            <div className="mx-auto flex max-w-6xl justify-center px-6 lg:px-8">
              <div className="mt-8 flow-root sm:mt-16">
                <div className="-m-2 w-fit rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10  lg:-m-4 lg:rounded-2xl lg:p-4">
                  <Image
                    src="/dashboard-preview.png"
                    alt="product preview"
                    width={955}
                    height={808}
                    quality={100}
                    className="rounded-md bg-special p-2 shadow-2xl ring-1 ring-gray-900/10 md:p-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative right-[calc(50%-13rem)] aspect-[1155/678] w-[36.125rem] translate-x-1/3 rotate-[30deg] bg-gradient-to-tr from-[#0a95ff] to-[#95f2fa] opacity-30 sm:left-[calc(50%-36rem)] sm:w-[72.1875rem] sm:translate-y-8"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <MaxWidthWrapper>
        <div className="mx-auto mt-20 flex max-w-5xl flex-col gap-20 sm:mt-40 sm:gap-40 ">
          {/* Intro */}
          <div>
            <div className="mb-6 px-6 lg:px-8">
              <div className="mx-auto max-w-2xl sm:text-center">
                <h2 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">
                  Start your first session in seconds
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Study effectively and efficiently.
                </p>
              </div>
            </div>
            {/* steps */}

            <ol className="my-2 space-y-4 pt-2 md:flex md:space-x-6 md:space-y-0 md:px-8">
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-blue-600">
                    Step 1
                  </span>
                  <span className="text-xl font-semibold">
                    Sign up for a free account
                  </span>
                  {/* <span className="mt-2 text-zinc-700">
                Either starting out with a free plan or choose our{" "}
                <Link
                  href="/pricing"
                  className="text-blue-700 underline underline-offset-2"
                >
                  pro plan
                </Link>
                .
              </span> */}
                </div>
              </li>
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-blue-600">
                    Step 2
                  </span>
                  <span className="text-xl font-semibold">
                    Choose one of our 38 <span className="text-blue-600">courses</span> & a{" "}
                    <span className="text-blue-600">question type</span>
                  </span>
                </div>
              </li>
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-blue-600">
                    Step 3
                  </span>
                  <span className="text-xl font-semibold">
                    Start studying!
                  </span>
                  {/* <span className="mt-2 text-zinc-700">
                
              </span> */}
                </div>
              </li>
            </ol>
          </div>

          {/* Scenarios */}
          <div>
            <div className="mb-6 px-6 lg:px-8">
              <div className="mx-auto max-w-2xl sm:text-center">
                <h2 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">
                  Crafted for AP Tests
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Practice every single type of problem to ensure you're prepared to answer all types of questions on your AP test in May!
                </p>
              </div>
            </div>
            {/* steps */}

            <div className="flex items-center justify-center">
              <div className="flex flex-col gap-6 md:flex-row">
                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>Multiple Choice</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Practice answering AP-stype multiple choice questions generated by specialized AI models.
                  </CardDescription>
                </Card>
                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>Written Free Response</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Practice writing free response questions and have them graded by a custom-trained AI.
                  </CardDescription>
                </Card>

                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>Conversation Prompts</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Practice speaking questions, a key component of language AP classes.
                  </CardDescription>
                </Card>
              </div>
            </div>
          </div>

          {/* Powered By */}
          <div>
            <div className="mb-6 px-6 lg:px-8">
              <div className="mx-auto max-w-2xl sm:text-center">
                <h2 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">
                  Powered by
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  These are the technologies behind the scene that make StudyAP
                  possible
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex flex-col gap-6 md:flex-row">
                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>Whisper AI</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Speech to text
                  </CardDescription>
                  <Image
                    src="/mic.webp"
                    alt="cafe scenario"
                    width={128}
                    height={128}
                    quality={100}
                    className="rounded-xl"
                  />
                </Card>
                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>GPT 4</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Comprehensive prompts and responses
                  </CardDescription>
                  <Image
                    src="/openai.webp"
                    alt="cafe scenario"
                    width={128}
                    height={128}
                    quality={100}
                    className="rounded-xl"
                  />
                </Card>

                <Card className="flex flex-col items-center justify-center gap-2 p-6 md:flex-1">
                  <CardTitle>WebSpeech</CardTitle>
                  <CardDescription className="mb-3 text-center">
                    Text to speech
                  </CardDescription>
                  <Image
                    src="/speaker.webp"
                    alt="cafe scenario"
                    width={128}
                    height={128}
                    quality={100}
                    className="rounded-xl"
                  />
                </Card>
              </div>
            </div>
          </div>

          
          </div>
      </MaxWidthWrapper>

      <Footer />
    </>
  );
}
