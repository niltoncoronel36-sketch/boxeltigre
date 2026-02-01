import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="mt-2 opacity-80">Página no encontrada.</p>
      <Link className="underline" to="/">Volver al inicio</Link>
    </div>
  );
}
