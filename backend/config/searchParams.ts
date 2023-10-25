interface paginationParams {
    pp: number //per page
    p: number //page
    sort: "asc" | "desc" | undefined //asc | desc | undefined, default - asc
    sortKey: string //sort key
}
interface occasionSearchParams extends paginationParams {
    updatedMax: Date
    updatedMin: Date
    createdMax: Date
    createdMin: Date
    title?: string
    location?: string
    canCancel?: boolean
}
interface customerSearchParams extends paginationParams {
    updatedMax: Date
    updatedMin: Date
    createdMax: Date
    createdMin: Date
}
interface templateSearchParams extends paginationParams {
    name?: string
    contents?: string
    description?: string
    updatedMax?: Date
    updatedMin?: Date
}
export { occasionSearchParams, customerSearchParams, templateSearchParams }