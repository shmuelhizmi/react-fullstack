import { Views } from "@react-fullstack/demo-interfaces";

export function Button(props: Views['Button']['props']) {
    return (
        <button onClick={() => props.onClick()}>{props.text}</button>
    );
}