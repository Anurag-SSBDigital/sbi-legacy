import { Button } from '../ui/button.tsx'
import { Checkbox } from '../ui/checkbox.tsx'
import { Label } from '../ui/label.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.tsx'

interface FilterPopoverProps {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
}

export function FilterPopover({
  options,
  selected,
  onChange,
  placeholder,
}: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>{placeholder}</Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='space-y-2'>
          {options.map((option) => (
            <div key={option} className='flex items-center space-x-2'>
              <Checkbox
                id={option}
                checked={selected.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, option])
                  } else {
                    onChange(selected.filter((item) => item !== option))
                  }
                }}
              />
              <Label htmlFor={option}>{option}</Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
