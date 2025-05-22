import { Card, CardBody, Tab, Tabs } from "@nextui-org/react"
import { useState } from "react"
import { Login } from "../../features/user/login"
// import { Register } from "../../features/user/register"
import { useRestoreAuthentication } from "../../hooks/useAuthGuard"

export const Auth = () => {
    const [selected, setSelected] = useState("login")

    useRestoreAuthentication();

    return (
      <Login setSelected={setSelected} />
    )
}
