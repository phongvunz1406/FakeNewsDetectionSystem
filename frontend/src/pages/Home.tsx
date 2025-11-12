import { FormInput, FormTextArea } from "../components/FormField";
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-md border border-gray-200 space-y-8">
        <FormInput id="speaker" label="Speaker's name"/>
        <FormInput id="statement" label="Statement"/>
        <FormTextArea id="fullText_based_content" label="Content"/>
        <FormTextArea id="source" label="Source"/>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white text-xl py-3 rounded-md hover:bg-blue-600 transition font-semibold cursor-pointer">
          Analyze
        </button>
      </form>
    </div>
  );
}