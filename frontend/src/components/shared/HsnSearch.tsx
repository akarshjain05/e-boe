import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { productService } from '@/api/services/products';

interface HsnSearchProps {
  value: string;
  onChange: (value: string, description: string) => void;
  disabled?: boolean;
}

export function HsnSearch({ value, onChange, disabled }: HsnSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['hsn-lookup', debouncedSearch],
    queryFn: () => productService.lookupHsn(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {value || "Search HSN/SAC..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type at least 2 digits to search HSN..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-zinc-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : debouncedSearch.length < 2 ? (
                "Type 2 or more characters to search."
              ) : (
                "No HSN/SAC codes found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.hsn_cd}
                  value={item.hsn_cd}
                  onSelect={() => {
                    onChange(item.hsn_cd, item.description);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start items-stretch py-2"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.hsn_cd ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{item.hsn_cd}</span>
                  </div>
                  <span className="text-xs text-zinc-500 pl-6 mt-1 line-clamp-2">
                    {item.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
