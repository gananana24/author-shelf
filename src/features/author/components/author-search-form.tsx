"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Field, FieldError } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

const formSchema = z.object({
  query: z.string().trim().min(1, "著者名を入力してください"),
})

const AuthorSearchForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data)
  }

  return (
    <form
      id="author-search-form"
      className="w-full"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="query"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field className="relative" data-invalid={fieldState.invalid}>
            <InputGroup className="h-12">
              <InputGroupInput {...field} enterKeyHint="search" placeholder="誰の本が読みたい？" />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <div className="absolute top-full left-0 mt-2 px-3 text-left">
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </div>
          </Field>
        )}
      />
    </form>
  )
}

export default AuthorSearchForm
