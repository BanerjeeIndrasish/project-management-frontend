const createOptions = (data, labelKey, valueKey) => {
    return data?.map(dt => ({
        label: dt[labelKey],
        value: dt[valueKey]
    }))
}

export { createOptions }