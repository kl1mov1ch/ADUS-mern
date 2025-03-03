import { Card, CardBody, Tab, Tabs } from "@nextui-org/react"
import { useState } from "react"
import { Login } from "../../features/user/login"
// import { Register } from "../../features/user/register"
import { useRestoreAuthentication } from "../../hooks/useAuthGuard"

export const Auth = () => {
    const [selected, setSelected] = useState("login")

    useRestoreAuthentication();

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col">
                <Card className="max-w-full w-[340px] h-[450px]">
                    <h1 className="text-center my-[20px] text-xl font-bold">ADUSK</h1>
                    <CardBody className="overflow-hidden">
                        <Tabs
                            fullWidth
                            size="md"
                            selectedKey={selected}
                            onSelectionChange={(key) => setSelected(key as string)}
                        >
                            <Tab key="login" title="Вход">
                                <Login setSelected={setSelected} />
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}
