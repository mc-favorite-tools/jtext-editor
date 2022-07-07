/// <reference types="vite/client" />
/// <reference types="react" />


declare module 'rc-color-picker' {

    interface ColorValue {
        open: boolean
        alpha: number
        color: string
    }

    export default React.Component<{
        color: string
        onChange?: (value: ColorValue) => void
        onClose?: (value: ColorValue) => void
        className?: string
        placement?: string
        children?: React.ReactElement
    }>
}


declare type Spread<T1, T2> = Omit<T2, keyof T1> & T1;