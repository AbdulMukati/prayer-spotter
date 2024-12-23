import { Search } from 'lucide-react';
import { Input } from '../ui/input';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[70%] px-4 z-10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search prayer spots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 w-full h-10 text-base shadow-lg"
        />
      </div>
    </div>
  );
};