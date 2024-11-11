import RSAForm from "@/components/RSAForm";
import { House } from "lucide-react";
import { Link } from "react-router-dom";

const Lab3 = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-2">
      <Link to="/" className="absolute top-4 left-4">
        <House color="white" size={"50"} />
      </Link>
      <RSAForm />
    </div>
  );
};

export default Lab3;
