import { Views } from "@react-fullstack/demo-interfaces";

export function Input(props: Views['Input']['props']) {
    return (
        <input type="text" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    );
}