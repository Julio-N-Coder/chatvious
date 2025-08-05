import React from "react";

export default function About() {
  return (
    <div className="bg-base-300 text-base-content text-lg px-2 my-2 container mx-auto rounded-md">
      <div className=" flex flex-col gap-4">
        <h1 className="font-bold text-center text-2xl xsm:text-3xl">
          Welcome to My Real-Time Chat App!
        </h1>
        <h3 className="text-center text-xl xsm:text-2xl">
          Thank you for visiting my real-time chat application. This project is
          a project I created to learn more about web development and serverless
          technologies.
        </h3>
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-xl xsm:text-2xl">
            What You’ll Find Here
          </h2>
          <p>
            This site is a real-time chat application built using React. In this
            app, you can create rooms and invite friends to join you in rooms,
            send join request to rooms and chat with people within chatrooms in
            real-time.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-xl xsm:text-2xl">
            Technology Behind the Scenes
          </h2>
          <p>
            <span className="font-bold">Front-End:</span> The site’s front page
            and about page are built with React.
          </p>
          <p>
            <span className="font-bold">Dynamic Content:</span> Once signed in,
            you’ll access additional pages rendered with EJS inside Lambda
            functions, ensuring secure and efficient content delivery.
          </p>
          <p>
            <span className="font-bold">AWS Infrastructure:</span> The
            infrastructure is primarily built using AWS SAM, a serverless AWS
            framework that allows for management and deployment of serverless
            applications on AWS. Some of those technologies in the
            infrastructure include
          </p>
          <ul className="list-disc list-inside">
            <li>
              <span className="font-bold">
                API Gateway (REST and WebSockets):{" "}
              </span>
              The app utilizes both REST and WebSocket APIs to handle HTTP
              requests and real-time communication.
            </li>
            <li>
              <span className="font-bold">Lambda Functions (compute): </span>
              The backend compute which is mainly invoked and ran by Api Gateway
            </li>
            <li>
              <span className="font-bold">DynamoDB (storage): </span> I use
              DynamoDB as the Database to this website.
            </li>
            <li>
              <span className="font-bold">User Authentication: </span>Amazon
              Cognito User Pools manage user sign-up, sign-in, and
              authentication processes.
            </li>
            <li>
              <span className="font-bold">Content Delivery: </span>The static
              front-end content is served through an Amazon CloudFront
              distribution, sourced from an S3 bucket.
            </li>
          </ul>
          <p>
            <span className="font-bold">CI/CD Pipeline: </span>Continuous
            integration and deployment are handled by GitHub Actions, that
            automatically test and deploys my code.
          </p>
        </div>
        <div className="font-bold">
          I will go into more technical detail about this website on my
          portfolio website
        </div>
      </div>
      <div id="socials" className="flex">
        <a href="https://github.com/Julio-N-Coder/chatvious">
          <svg
            className="w-[48px] h-[48px] text-base-content"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
