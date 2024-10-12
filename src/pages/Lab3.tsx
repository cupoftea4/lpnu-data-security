import RC5Form from "@/components/RC5From";
import { House } from "lucide-react";
import { Link } from "react-router-dom";

const Lab3 = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-2">
      <Link to="/" className="absolute top-4 left-4">
        <House color="white" size={"50"} />
      </Link>
      <RC5Form />
    </div>
  );
};

export default Lab3;
