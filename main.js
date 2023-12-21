function Validator(formSelector, options = {}) {
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    let formRules = {};
    /**
     * if an exception occurs when return `message exception`
     * if no exception occurs when return `undefined`
     */
    let validatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui long nhap truong nay';
        },
        email: function (value) {
            let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Vui long nhap email';
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui long nhap it nhat ${min} ki tu`;
            }
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Vui long nhap toi da ${max} ki tu`;
            }
        }
    };
    //Get element in DOM flow formSelector
    let formElement = document.querySelector(formSelector);
    //Only do it when have formElement.
    if (formElement) {
        let inputs = formElement.querySelectorAll('[name][rules]');
        for (let input of inputs) {
            let rules = input.getAttribute('rules').split('|');
            for (let rule of rules) {
                let ruleInfo;
                let isRuleHasValue = rule.includes(':');
                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }
                let ruleFunc = validatorRules[rule];
                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }
                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }
            //Listen event to do validate (blur, change, ...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }
        //Perform validation
        function handleValidate(event) {
            let rules = formRules[event.target.name];
            let errorMessage;
            rules.find(function (rule) {
                errorMessage = rule(event.target.value);
                return errorMessage;
            });
            //If have exception => show exception to UI.
            if (errorMessage) {
                let formGroup = getParent(event.target, '.form-group');
                if (formGroup) {
                    formGroup.classList.add('invalid')
                    let formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }
            return !errorMessage;
        }
        //Clear message exception
        function handleClearError(event) {
            let formGroup = getParent(event.target, '.form-group');
            let formMessage = formGroup.querySelector('.form-message');
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
    }
    formElement.onsubmit = function (event) {
        event.preventDefault();
        let inputs = formElement.querySelectorAll('[name][rules]');
        let isValid = true;
        for (let input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }
        //When don't exception when submit form
        if (isValid) {
            if (typeof options.onSubmit === 'function') {
                let enableInputs = formElement.querySelectorAll('[name]');
                let formValues = Array.from(enableInputs).reduce(function (values, input) {
                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = '';
                                return values;
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});
                //Call onSubmit and return form
                options.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }
}