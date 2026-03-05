import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Project from "./pages/Project";
import Canvas from "./pages/Canvas";
import ReferenceCollection from "./pages/ReferenceCollection";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/project/:id" element={<Project />} />
      <Route path="/canvas/:id" element={<Canvas />} />
      <Route path="/collection/:id" element={<ReferenceCollection />} />
    </Routes>
  );
}
