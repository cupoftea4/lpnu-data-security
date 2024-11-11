import DSSForm from "@/components/DSSForm";
import { House } from "lucide-react";
import { Link } from "react-router-dom";

const Lab5 = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-2">
      <Link to="/" className="absolute top-4 left-4">
        <House color="white" size={"50"} />
      </Link>
      <DSSForm />
    </div>
  );
};

export default Lab5;
