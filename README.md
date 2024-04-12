# **Chatvious Project**
## Description
This project is a real-time chat app that I am making mainly to show off on my portfolio but also for anyone who would like to use the project. Right now, the project is has nothing to show and is just initialized but I will update this when there are new updates to this project.

### Project layout
This will be updated when more stuff is added

**chatvious**/  
├── READMD.md  
├── **client**  
│   ├── **components**  
│   ├── package-lock.json  
│   ├── package.json  
│   ├── postcss.config.js  
│   ├── **src**  
│   │   ├── app.tsx  
│   │   ├── **fonts**  
│   │   ├── index.html  
│   │   ├── index.tsx  
│   │   └── styles.css  
│   ├── tailwind.config.js  
│   ├── tsconfig.json  
│   └── webpack.config.js  
├── package-lock.json  
├── package.json  
├── postcss.config.js  
├── **src**  
│   ├── app.ts  
│   ├── **components**  
│   ├── **controllers**  
│   ├── **lib**  
│   ├── **models**  
│   ├── **public**  
│   │   ├── **css**  
│   │   │   └── styles.css  
│   │   └── **js**  
│   ├── **routes**  
│   └── **views**  
│       └── test.ejs  
├── tailwind.config.js  
└── tsconfig.json

For the `main/root` page of the project, which is what people are going to see first, all that code is basically going to be in the `client` directory. The rest of the pages are going to be in the `root level src` directory and they are going to be rendered with ejs templates. You can't see this there but when you build the project, there is going to be a root level `dist` directory that contains the actuall code that is going to run. In the `root level src` I have an `app.ts` file which is the `main entry point` of the nodejs server. In the root level src, I also have the mvc layout to use in the server side for code organization.

### How to use the project
I have a couple of different commands to build and run the project and will add/modify more when I work on this project. The **main** commands are these below. **If you would just like to quickly build and run the entire project use** `npm run fullBuild:prod` and `npm start`.

For the **client directory**, to build the project use `npm run build` or `npm run build:prod` for a production build. To run the project in a development server with hot module replacement use `npm run serve`

For the **src directory**, to build the project use `npm run build`. To run the code use `npm run dev` or use `npm start` to run in production.

Some extra commands for the **src directory** are the `npm run buildDev` which builds and runs the code. The `npm run fullBuild` command builds the code in both the **client directory** and the **src directory**. And the `npm run fullDev` command runs **fullDev** command and runs the Code. I know that this is a bit convoluted but they are their if you need them.

### Future plans
In the future I plan to add many more things like how I need to **add webpack to bundle public accesets of my ejs templates** and some testing. First I need a functioning website and with the website I plan to use technologies like aws's Amazon cognito for front page authentictation and also authorization, dynamodb for the database, socket.io for realtime chatting and redis with the socket.io redis adapter to communicate with other servers/instances. I plan for all of this to be hosted on aws ecs and I will seperate the project into their own ecs tasks/service's where needed like the socket.io server. I plan to use docker to containerize the appliation. I will also add CI/CD to my project once the the website is ready to be hosted.
