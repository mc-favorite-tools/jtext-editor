/*
 * The AGPL License (AGPL)
 * Copyright (c) 2023 hans000
 */
import { EditorThemeClasses } from "lexical"
import './theme.css'

const theme: EditorThemeClasses = {
    text: {
        bold: 'jtp__bold',
        italic: 'jtp__italic',
        strikethrough: 'jtp__strikethrough',
        underline: 'jtp__underline',
        underlineStrikethrough: 'jtp__underline-strikethrough',
        subscript: 'jtp__subscript',
        superscript: 'jtp__superscript'
    },
    mark: 'jtp__mark',
    markOverlap: 'jtp__mark-overlap',

}


export default theme