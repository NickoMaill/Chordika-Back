export enum FormMakerStructEnum {
    TAB = 0,
    PANEL = 1,
    SEARCH = 2,
}

export enum AutoCompleteEnum {
    ON = 'on',
    OFF = 'off',
    GIVEN_NAME = 'given-name',
    FAMILY_NAME = 'family-name',
    EMAIL = 'email',
    ADDRESS_LINE_1 = 'address-line1',
    COUNTRY = 'country',
    COUNTRY_NAME = 'country-name',
    BDAY = 'bday',
}

export enum AutoCapitalizeEnum {
    OFF = 'off',
    ON = 'on',
    WORDS = 'words',
    CHARACTERS = 'characters',
}

export enum InputTypeEnum {
    BUTTON = 'button',
    EMAIL = 'email',
    HIDDEN = 'hidden',
    NUMBER = 'number',
    PASSWORD = 'password',
    RESET = 'reset',
    SEARCH = 'search',
    TEL = 'tel',
    TEXT = 'text',
    URL = 'url',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
    SELECT_MULTIPLE = 'tokenmultiple',
    TEXTAREA = 'textarea',
    HTML_PARSER = 'htmlParser',
    JSON = 'JSON',
    DATE = 'date',
    DATETIME = 'datetime',
    DATE_SEARCH = 'dateSearch',
    COLOR = 'color',
    SWITCH = 'switch',
    HTML_CONTENT = 'htmlContent',
    FILE = 'file',
    RANGE = 'range',
    CRON = 'cron',
    AUTOCOMPLETE = 'autocomplete',
    MULTIPLE_AUTOCOMPLETE = 'multipleAutocomplete',
    AJAX_AUTOCOMPLETE = 'ajaxAutocomplete',
    AJAX_MULTIPLE_AUTOCOMPLETE = 'ajaxMultipleAutocomplete',
    CENTER_TABLE = 'center',
}

export interface Struct<T, TType extends FormMakerStructEnum = FormMakerStructEnum> {
    title: string;
    icon?: string;
    content: T[];
    hidden?: boolean;
    type: TType;
}

export type Tab = Struct<Panel, FormMakerStructEnum.TAB>;
export type Panel = Struct<Element, FormMakerStructEnum.PANEL>;
export type Search = Struct<Element, FormMakerStructEnum.SEARCH>;

export interface SelectOption {
    value?: any;
    label?: string;
}

export interface RadioOption extends SelectOption {}

export interface AutoCompleteOption extends SelectOption {}

export interface CheckBoxOption extends SelectOption {
    defaultChecked: boolean;
}

export interface Element {
    id: string;
    index?: number;
    label?: string;
    logLabel?: string;
    required?: boolean;
    unique?: boolean;
    size?: number;
    helpText?: string;
    type: InputTypeEnum;
    autoComplete?: AutoCompleteEnum;
    autoCapitalize?: AutoCapitalizeEnum;
    value?: any;
    disabled?: boolean;
    readOnly?: boolean;
    pattern?: RegExp;
    showLabel?: boolean;
    placeholder?: string;
    icon?: string;
    selectOptions?: SelectOption[];
    checkBoxOptions?: CheckBoxOption[];
    radioOptions?: RadioOption[];
    autocompleteOptions?: AutoCompleteOption[];
    limitChar?: number;
    textRows?: number;
    dateFormat?: string;
    dateViews?: Array<'day' | 'month' | 'year'>;
    dateOpenTo?: 'day' | 'month' | 'year';
    switchValue?: string;
    ssr?: boolean;
    ssrUrlExtension?: string;
    entity?: string;
    parentField?: string;
    min?: number;
    max?: number;
    step?: number;
    row?: boolean;
}

export type FormMaker = {
    tabs?: Tab[];
    panels?: Panel[];
    search?: Search[];
};
