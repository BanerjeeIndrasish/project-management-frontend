import { memo, useEffect, useMemo, useState } from "react";
import {
    Calendar,
    Check,
    ChevronDown,
    Eye,
    EyeOff,
    Loader2,
    X,
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

// Centralizes the "is this field hidden" rule so rendering and validation
// can never disagree (previously validation ran on hidden fields too).
const isFieldHidden = (field, isEditing) => {
    if (field.fieldLabel === "Status" && !isEditing) return true;
    if (field.visible !== undefined && !field.visible) return true;
    return false;
};

const FormModal = (props) => {
    const {
        open = false,
        loading = false,
        width = 520,
        modalTitle = "",
        isForm = true,
        formFields = [],
        isEditing = false,
        record,
        handleSubmit,
        handleCancel,
        isBill = false,
        otherThanFormElement,
        formError,
        onConfirm,
        confirmLabel = "Confirm",
        confirmVariant = "primary",
    } = props;

    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({});
    const [billPeriod, setBillPeriod] = useState("");

    const initialValues = useMemo(() => {
        const values = {};
        formFields.forEach((field) => {
            values[field.fieldName] =
                record?.[field.fieldName] ?? field.defaultValue ?? "";
        });

        return values;
    }, [formFields, record]);

    useEffect(() => {
        if (!isForm || !open) return;
        console.log('In effect initial values', initialValues);

        setFormData(initialValues);
        setErrors({});
    }, [open, initialValues, isForm]);

    // New: close on Escape, and lock background scroll while open.
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") handleCancel?.();
        };
        document.addEventListener("keydown", onKeyDown);

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    const firstVisibleFieldName = useMemo(
        () => formFields.find((f) => !isFieldHidden(f, isEditing))?.fieldName,
        [formFields, isEditing]
    );

    const updateField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const preventUnwantedNumbers = (e) => {
        if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
    };

    const validateForm = () => {
        const validationErrors = {};

        formFields.forEach((field) => {
            if (isFieldHidden(field, isEditing)) return;

            const value = formData[field.fieldName];

            if (
                field.isRequired &&
                (value === undefined ||
                    value === null ||
                    value === "" ||
                    (Array.isArray(value) && value.length === 0))
            ) {
                validationErrors[field.fieldName] =
                    field.isRequiredMessage || `${field.fieldLabel} is required`;
                return;
            }

            // Fix: this used to only ever check a mobile-number pattern, even
            // for fields like "email" that opted into canInvalid.
            if (field.canInvalid && value) {
                if (field.fieldName === "mobile" || field.fieldName === "phone") {
                    if (!MOBILE_REGEX.test(String(value))) {
                        validationErrors[field.fieldName] =
                            field.invalidMessage || "Please enter a valid mobile number";
                    }
                } else if (field.fieldName === "email" || field.inputType === "email") {
                    if (!EMAIL_REGEX.test(String(value))) {
                        validationErrors[field.fieldName] =
                            field.invalidMessage || "Please enter a valid email address";
                    }
                }
            }
        });

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        handleSubmit?.(isEditing ? "edit" : "add", formData);
    };

    const onCancel = () => {
        setFormData({});
        setErrors({});
        setShowPassword({});
        handleCancel?.();
    };

    // Fix: these were keyed off the literal field label "Due Date", so ANY
    // form using that label (not just billing) would silently inherit
    // billing-only date constraints. Now scoped to isBill explicitly.
    const getMinDueDate = (field) => {
        if (!isBill || field.fieldLabel !== "Due Date") return undefined;
        const today = new Date();
        today.setDate(today.getDate() + 1);
        return today.toISOString().split("T")[0];
    };

    const getMinDateFromBillPeriod = () => {
        if (!isBill || !billPeriod) return undefined;
        const [year, month] = billPeriod.split("-");
        return `${year}-${month}-01`;
    };

    const renderField = (field, isFirst) => {
        const rawValue = formData[field.fieldName];
        const value = rawValue ?? "";
        const hasError = Boolean(errors[field.fieldName]);

        const baseInputClass = `
        w-full
        rounded-lg
        border
        bg-white
        px-3
        py-2.5
        text-sm
        text-[#1A1D1F]
        outline-none
        transition
        placeholder:text-[#9AA0A6]
        disabled:cursor-not-allowed
        disabled:bg-[#FAFAF9]
        ${hasError
                ? "border-[#B3432B] focus:border-[#B3432B]"
                : "border-[#E4E2DD] focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]"
            }
        `;

        if (field.inputType === "text" || field.inputType === "email") {
            return (
                <div className="relative">
                    {field.prefixIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
                            {field.prefixIcon}
                        </div>
                    )}
                    <input
                        type="text"
                        value={value}
                        autoFocus={isFirst}
                        placeholder={`Enter ${field.fieldLabel}`}
                        disabled={field.disabled}
                        onChange={(e) => updateField(field.fieldName, e.target.value)}
                        className={`${baseInputClass} ${field.prefixIcon ? "pl-10" : ""} ${field.suffixIcon ? "pr-10" : ""
                            }`}
                    />
                    {field.suffixIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
                            {field.suffixIcon}
                        </div>
                    )}
                </div>
            );
        }

        if (field.inputType === "textarea") {
            return (
                <textarea
                    value={value}
                    autoFocus={isFirst}
                    placeholder={`Enter ${field.fieldLabel}`}
                    disabled={field.disabled}
                    onChange={(e) => updateField(field.fieldName, e.target.value)}
                    className={`${baseInputClass} min-h-24`}
                />
            );
        }

        if (field.inputType === "password") {
            const visible = showPassword[field.fieldName];
            return (
                <div className="relative">
                    <input
                        type={visible ? "text" : "password"}
                        value={value}
                        autoFocus={isFirst}
                        placeholder="Enter your password"
                        disabled={field.disabled}
                        onChange={(e) => updateField(field.fieldName, e.target.value)}
                        className={`${baseInputClass} pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword((prev) => ({ ...prev, [field.fieldName]: !visible }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#4B5058]"
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            );
        }

        if (field.inputType === "number") {
            return (
                <div className="relative">
                    {field.prefixIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
                            {field.prefixIcon}
                        </div>
                    )}
                    <input
                        type="number"
                        value={value}
                        autoFocus={isFirst}
                        placeholder={`Enter ${field.fieldLabel}`}
                        disabled={field.disabled}
                        onKeyDown={preventUnwantedNumbers}
                        onChange={(e) => {
                            updateField(field.fieldName, e.target.value);
                            field.onChange?.(e.target.value);
                        }}
                        className={`${baseInputClass} ${field.prefixIcon ? "pl-10" : ""}`}
                    />
                    {field.suffixIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
                            {field.suffixIcon}
                        </div>
                    )}
                </div>
            );
        }

        if (field.inputType === "date") {
            const isMonth = field.dateType === "period";
            return (
                <div className="relative">
                    <input
                        type={isMonth ? "month" : "date"}
                        value={value}
                        autoFocus={isFirst}
                        disabled={field.disabled}
                        min={
                            isMonth
                                ? undefined
                                : field.fieldLabel === "Due Date"
                                    ? getMinDueDate(field)
                                    : getMinDateFromBillPeriod()
                        }
                        onChange={(e) => {
                            const newValue = e.target.value;
                            updateField(field.fieldName, newValue);
                            if (isMonth) setBillPeriod(newValue);
                            field.onChange?.(newValue);
                        }}
                        className={`${baseInputClass} pr-10`}
                    />
                    <Calendar
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]"
                    />
                </div>
            );
        }

        if (field.inputType === "dropdown") {
            const isMultiple = field.selectMode === "multiple";
            // Fix: option values are always strings in the DOM. If the record's
            // value comes back as a number (typical for a MySQL INT column),
            // a strict-typed compare could leave the select showing blank.
            const selectValue = isMultiple
                ? Array.isArray(value)
                    ? value.map(String)
                    : []
                : value === "" || value === null || value === undefined
                    ? ""
                    : String(value);

            return (
                <div className="relative">
                    <select
                        multiple={isMultiple}
                        value={selectValue}
                        autoFocus={isFirst}
                        disabled={field.disabled}
                        onChange={(e) => {
                            const newValue = isMultiple
                                ? Array.from(e.target.selectedOptions, (o) => o.value)
                                : e.target.value;
                            updateField(field.fieldName, newValue);
                            field.onChange?.(newValue);
                        }}
                        className={`${baseInputClass} ${isMultiple ? "min-h-24" : "appearance-none pr-10"
                            }`}
                    >
                        {!isMultiple && <option disabled value="">Select {field.fieldLabel}</option>}
                        {field.options?.map((option) => (
                            <option key={option.value} value={String(option.value)}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {!isMultiple && (
                        <ChevronDown
                            size={18}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]"
                        />
                    )}
                </div>
            );
        }

        return null;
    };

    if (!open) return null;

    const confirmButtonClass =
        confirmVariant === "danger"
            ? "bg-[#B3432B] hover:bg-[#9A3823]"
            : "bg-[#0F5257] hover:bg-[#0C4448]";

    // Footer sits OUTSIDE the scrolling area (shrink-0), so the buttons stay
    // pinned at the bottom of the modal while only the fields scroll.
    // Buttons are left-aligned (justify-start).
    const footerClass =
        "flex shrink-0 items-center justify-start gap-3 border-t border-[#E4E2DD] bg-white px-6 py-4";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            {/* Flex column: header (fixed) + scrollable body + footer (fixed). */}
            <div
                style={{ width: "100%", maxWidth: width }}
                className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#E4E2DD] px-6 py-4">
                    <h2 className="text-base font-semibold text-[#1A1D1F]">{modalTitle}</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F0EFEB] hover:text-[#1A1D1F]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {isForm ? (
                    // The <form> wraps both the scroll area and the footer, so the
                    // submit button still works even though it is outside the scroller.
                    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            {formError && (
                                <div className="mb-5 rounded-md border border-[#B3432B]/30 bg-[#B3432B]/5 px-3 py-2 text-sm text-[#B3432B]">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-5">
                                {formFields.map((field) => {
                                    if (isFieldHidden(field, isEditing)) return null;
                                    return (
                                        <div key={field.fieldName}>
                                            <label className="mb-1.5 block text-sm font-medium text-[#4B5058]">
                                                {field.fieldLabel}
                                                {field.isRequired && <span className="ml-1 text-[#B3432B]">*</span>}
                                            </label>
                                            {renderField(field, field.fieldName === firstVisibleFieldName)}
                                            {errors[field.fieldName] && (
                                                <p className="mt-1 text-xs text-[#B3432B]">{errors[field.fieldName]}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={footerClass}>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="rounded-lg border border-[#E4E2DD] px-4 py-2.5 text-sm font-medium text-[#4B5058] transition hover:bg-[#FAFAF9] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            {handleSubmit && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F5257] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0C4448] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {!loading && <Check size={16} />}
                                    {isBill
                                        ? modalTitle === "Generate Bills"
                                            ? "Generate"
                                            : "Show"
                                        : isEditing
                                            ? "Save"
                                            : "Create"}
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto p-6">
                            {otherThanFormElement}
                        </div>

                        {/* Fix: previously there was no footer at all in non-form
                            mode, so otherThanFormElement had no way to trigger an
                            action (e.g. a delete confirmation had nothing to click). */}
                        {onConfirm && (
                            <div className={footerClass}>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="rounded-lg border border-[#E4E2DD] px-4 py-2.5 text-sm font-medium text-[#4B5058] transition hover:bg-[#FAFAF9] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
                                >
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {confirmLabel}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(FormModal);