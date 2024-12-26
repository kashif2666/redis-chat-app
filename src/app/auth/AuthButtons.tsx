import { Button } from "@/components/ui/button"

const AuthButtons = () => {
  return (
    <div className="flex gap-3 mt-10 flex-1 md:flex-row flex-col relative z-50">
      <Button className="w-full" variant={"outline"}>Sign up</Button>
      <Button className="w-full">Login</Button>

    </div>
  )
}

export default AuthButtons