import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2">The requested model or resource could not be located.</p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all"
      >
        Return to VentureIQ
      </Link>
    </div>
  );
}

