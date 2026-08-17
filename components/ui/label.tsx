import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('text-xs font-bold text-[#526861]', className)} {...props} />
}

export { Label }
