import React from "react";
// import { Link, NavLink } from "react-router-dom";
import Navbar from "../../components/navbar/navbar";

export default function About() {
  return (
    <div>
      <Navbar />
      {/* will add more later. This will do just for now */}
      <div className="bg-info text-info-content container mx-auto rounded-md">
        Welcome to the chatvious website. This is a real time chat app website
        where you can make rooms and join rooms to chat with you friends! This
        website is mainly a website I am making to show off on my portfolio to
        showcase my skills but it can be used by anyone who wants to use it. I
        hope you enjoy the website!
      </div>
    </div>
  );
}
