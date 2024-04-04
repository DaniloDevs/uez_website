"use client"

import React, { useEffect, useRef, useState } from "react"
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner"
import { useSearchParams, useRouter } from "next/navigation"
import UserCards from "./UserCards"
import Button from "@/components/layout/Button/Button"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Modal from "@/components/Modal/Modal"
import { EyeClosedIcon, EyeOpenIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"
import api from "@/lib/api"

const userFormSchema = z
  .object({
    email: z.string().min(1, "O e-mail é obrigatório").email("Formato de e-mail inválido"),
    nome: z
      .string()
      .min(1, "O nome é obrigatório")
      .min(3, "O nome deve ter mais de 3 caracteres")
      .regex(/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]+$/, "O nome deve conter apenas letras")
      .transform((value) =>
        value
          .split(" ")
          .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
          .join(" ")
      ), // Capitaliza os nomes,
    userType: z.enum(["UZER", "CLIENTE"]),
    senha: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(6, "A senha deve ter mais de 6 caracteres")
      .max(24, "A senha deve ter menos de 24 caracteres"),
    confirmarSenha: z.string().max(24, "A senha deve ter menos de 24 caracteres"),
    telefone: z
      .string()
      .min(1, "O telefone é obrigatório")
      .min(10, "O telefone deve ter 10 dígitos")
      .max(15, "O telefone deve ter no máximo 15 dígitos"),
    dataNascimento: z
      .string()
      .min(1, "A data de nascimento é obrigatória")
      .min(9, "A data de nascimento deve ter 10 dígitos"),
    cpf: z
      .string()
      .min(1, "O CPF é obrigatório")
      .regex(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}$/, "Formato de CPF inválido")
      .min(14, "O CPF deve ter 14 dígitos")
      .max(14, "O CPF deve ter 14 dígitos"),
    cep: z
      .string()
      .min(1, "O CEP é obrigatório")
      .regex(/^[0-9]{5}-[0-9]{3}$/, "Formato de CEP inválido"),
    endereco: z.object({
      logradouro: z.string().min(1, "O logradouro é obrigatório"),
      numero: z.string().min(1, "O número é obrigatório"),
      complemento: z.optional(z.string()),
      bairro: z.string().min(1, "O bairro é obrigatório"),
      cidade: z.string().min(1, "A cidade é obrigatória"),
      estado: z.string().min(1, "O estado é obrigatório"),
    }),
    idServico: z.string().min(1, "O serviço é obrigatório"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    path: ["confirmarSenha"], // path of error
    message: "As senhas devem coincidir",
  })

// Adicione a validação personalizada para confirmarSenha
userFormSchema.refine((data) => data.senha === data.confirmarSenha, {
  path: ["confirmarSenha"],
  message: "As senhas devem coincidir",
})

type userFormData = z.infer<typeof userFormSchema>

export default function Cadastro() {
  const router = useRouter()

  const { get } = useSearchParams()
  useEffect(() => {
    api
      .get<{ nome: string; categoria: string; id: string }[]>("/servicos")
      .then(({ data }) => {
        setServicos(data)
      })
      .catch(() => [])
  }, [])

  const [servicos, setServicos] = useState<{ nome: string; id: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<userFormData>({
    /* @ts-ignore */
    resolver: zodResolver(userFormSchema),
  })

  const [userType, setUserType] = useState<"CLIENTE" | "UZER" | any>(get("userType")?.toUpperCase())
  const [formStep, setFormStep] = useState<number>(1)

  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("null")
  const [haveButton, setHaveButton] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleModal(message: string, hasButton: boolean = true) {
    setModalMessage(message)
    setHaveButton(hasButton)
    setShowModal((prevState) => !prevState)
  }

  const [passwordType, setPasswordType] = useState<"password" | "text">("password")
  const [pwChangerIcon, setPwChangerIcon] = useState<React.ReactNode | string>(<EyeClosedIcon width={20} height={20} />)
  const [showPasswordChanger, setShowPasswordChanger] = useState(false)

  const [confirmPasswordType, setConfirmPasswordType] = useState<"password" | "text">("password")
  const [confirmPwChangerIcon, setConfirmPwChangerIcon] = useState<React.ReactNode | string>(
    <EyeClosedIcon width={20} height={20} />
  )
  const [showConfirmPasswordChanger, setShowConfirmPasswordChanger] = useState<boolean>(false)

  //onSubmitForm
  async function cadastrar(data: userFormData) {
    const { nome, email, userType, senha, cpf, cep, dataNascimento, endereco, telefone, idServico } = data
    if (userType === "UZER") {
      if (!idServico) {
        return
      }
    }
    setIsSubmitting(true)
    toggleModal("Cadastrando...")
    const { data: uzerData } = await api.post("/register", {
      nome,
      email,
      senha,
      cpf,
      dataNasc: dataNascimento,
      cep,
      telefone,
      endereco,
      usertype: userType,
      idServico,
      username: email.split("@")[0],
    })

    setShowModal(false)
    toggleModal(uzerData.message)
    setIsSubmitting(false)
    if (uzerData.message.includes("sucesso")) {
      new Promise((resolve) => setTimeout(resolve, 4000))
      router.push(`/login?userEmail=${email}`)
    }
  }

  const [senhasOk, setSenhasOk] = useState<string>("")

  const validateConfirmarSenha = () => {
    const senha = getValues("senha")
    const confirmarSenha = getValues("confirmarSenha")

    if (senha === confirmarSenha) {
      return true
    } else {
      setSenhasOk("As senhas devem coincidir")
      return false
    }
  }

  const formRef = useRef<HTMLFormElement>(null)

  const [isFirstClick, setIsFirstClick] = useState(true)
  return (
    <form
      ref={formRef}
      className="bg-white rounded-3xl py-6 px-4 min-h-[95%] w-[40 %] flex flex-col items-center justify-center desktop:w-4/5 mobile:w-full mobile:h-full mobile:px-0"
      onSubmit={handleSubmit(cadastrar)}
    >
      <div className="w-full h-full flex flex-col items-center justify-between gap-2">
        <div className="mt-2 text-center">
          <h1 className="font-extrabold p-0 my-0 text-3xl mx-auto">CADASTRO</h1>
          <h2 className="font-extrabold text-xl p-0 my-0 mx-auto">Etapa {formStep}</h2>
        </div>
        {formStep === 1 && (
          <div className="flex flex-col items-center justify-center gap-3 w-4/5 animate-transitionX">
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="email" title="E-mail" className="self-start text-base font-medium">
                E-mail:
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 rounded-md font-medium text-base px-3 py-2 outline-none ${
                    errors.email && "border-2 rounded border-red-500"
                  }`}
                  type="text"
                  id="email"
                  maxLength={200}
                  placeholder="example@gmail.com"
                  {...register("email")}
                />
              </div>
              {errors.email && <span className="font-medium text-xs self-start my-1">{errors.email.message}</span>}
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="nome" title="Nome Completo" className="self-start text-base font-medium">
                Nome Completo:
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 font-medium rounded-md text-base px-3 py-2 outline-none ${
                    errors.nome && "border-2 rounded border-red-500"
                  }`}
                  type="text"
                  id="nome"
                  placeholder="David de Oliveira Guimarães"
                  maxLength={200}
                  {...register("nome")}
                />
              </div>
              {errors.nome && <span className="font-medium text-xs self-start my-1">{errors.nome.message}</span>}
            </div>
            <UserCards userType={userType} setUserType={setUserType} setZodUserType={setValue} />
          </div>
        )}
        {formStep === 2 && (
          <div className="flex flex-col items-center justify-center gap-2 w-4/5 animate-transitionX">
            <div className="flex items-center justify-center w-full gap-2">
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="telefone" title="Telefone" className="self-start text-base font-medium">
                  Seu Telefone:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium rounded-md text-base px-3 py-2 outline-none ${
                      errors.telefone && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="telefone"
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    {...register("telefone", {
                      onChange: (e) => {
                        if (e.target.value.length === 2 && !e.target.value.includes(" ")) {
                          setValue("telefone", getValues("telefone") + " ")
                        }
                        const rawTel = e.target.value.replace(/\D/g, "") // Remove não dígitos
                        const formattedTel = rawTel.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
                        setValue("telefone", formattedTel)
                      },
                    })}
                  />
                </div>
                {errors.telefone && (
                  <span className="font-medium text-xs self-start my-1">{errors.telefone.message}</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="datanascimento" title="Data de Nascimento" className="self-start text-base font-medium">
                  Data de Nascimento:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium rounded-md text-base px-3 py-2 outline-none ${
                      errors.dataNascimento && "border-2 rounded border-red-500"
                    }`}
                    type="date"
                    id="datanascimento"
                    maxLength={10}
                    max="2005-12-31"
                    min="1950-01-01"
                    {...register("dataNascimento")}
                  />
                </div>
                {errors.dataNascimento && (
                  <span className="font-medium text-xs self-start my-1">{errors.dataNascimento.message}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="senha" title="Senha" className="self-start text-base font-medium">
                Crie a sua Senha:
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 font-medium rounded-md text-base px-3 py-2 outline-none ${
                    errors.senha && "border-2 rounded border-red-500"
                  }`}
                  type={passwordType}
                  id="senha"
                  maxLength={24}
                  placeholder="Use uma senha com mais de 6 caracteres"
                  {...register("senha", {
                    onChange: (e) => {
                      if (e.target.value.length > 0) {
                        setShowPasswordChanger(true)
                      } else {
                        setShowPasswordChanger(false)
                      }
                    },
                  })}
                />
                {showPasswordChanger && (
                  <button
                    title="Exibir/ocultar senha"
                    type="button"
                    className="bg-cinzero hover:bg-[#e9e9e9] border-none py-2 px-3 h-full cursor-pointer flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault()
                      setPasswordType((prevState) => {
                        setPwChangerIcon(
                          prevState === "text" ? (
                            <EyeClosedIcon width={20} height={20} />
                          ) : (
                            <EyeOpenIcon width={20} height={20} />
                          )
                        )
                        return prevState === "text" ? "password" : "text"
                      })
                    }}
                  >
                    {pwChangerIcon}
                  </button>
                )}
              </div>
              {errors.senha && <span className="font-medium text-xs self-start my-1">{errors.senha.message}</span>}
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="confirmasenha" title="Confirme a sua Senha" className="self-start text-base font-medium">
                Confirme a sua Senha:
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                    (errors.confirmarSenha || senhasOk) && "border-2 rounded border-red-500"
                  }`}
                  type={confirmPasswordType}
                  id="confirmasenha"
                  maxLength={24}
                  placeholder="Confirme sua senha"
                  {...register("confirmarSenha", {
                    onChange: (e) => {
                      if (e.target.value.length > 0) {
                        setShowConfirmPasswordChanger(true)
                      } else {
                        setShowConfirmPasswordChanger(false)
                      }
                      if (validateConfirmarSenha()) {
                        setSenhasOk("")
                      }
                    },
                  })}
                />
                {showConfirmPasswordChanger && (
                  <button
                    title="Exibir/ocultar senha"
                    type="button"
                    className="bg-cinzero hover:bg-[#e9e9e9] border-none py-2 px-3 h-full cursor-pointer flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault()
                      setConfirmPasswordType((prevState) => {
                        setConfirmPwChangerIcon(
                          prevState === "text" ? (
                            <EyeClosedIcon width={20} height={20} />
                          ) : (
                            <EyeOpenIcon width={20} height={20} />
                          )
                        )
                        return prevState === "text" ? "password" : "text"
                      })
                    }}
                  >
                    {confirmPwChangerIcon}
                  </button>
                )}
              </div>
              {(errors.confirmarSenha || senhasOk) && (
                <span className="font-medium text-xs self-start my-1">
                  {errors?.confirmarSenha?.message || senhasOk}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center w-full gap-2">
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="cpf" title="CPF" className="self-start text-base font-medium">
                  CPF:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                      errors.cpf && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="cpf"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    {...register("cpf", {
                      onChange: (e) => {
                        const rawCpf = e.target.value.replace(/\D/g, "") // Remove não dígitos
                        const formattedCpf = rawCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") // Formata como XXX.XXX.XXX-XX
                        setValue("cpf", formattedCpf)
                      },
                    })}
                  />
                </div>
                {errors.cpf && <span className="font-medium text-xs self-start my-1">{errors.cpf.message}</span>}
              </div>
            </div>
          </div>
        )}
        {formStep === 3 && (
          <div className="flex flex-col items-center justify-center gap-2 w-4/5 animate-transitionX">
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="cep" title="CEP" className="self-start text-base font-medium">
                CEP:
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                    errors.cep && "border-2 rounded border-red-500"
                  }`}
                  type="text"
                  id="cep"
                  maxLength={9}
                  placeholder="XXXXX-XXX"
                  {...register("cep", {
                    onChange: () => {
                      const rawCep = getValues("cep").replace(/\D/g, "")
                      const cep = rawCep.replace(/(\d{5})(\d{3})/, "$1-$2")
                      setValue("cep", cep) // Atualiza o estado com o Cep formatado
                    },
                  })}
                />
                <button
                  title="Buscar CEP"
                  type="button"
                  className="bg-cinzero hover:bg-[#e9e9e9] border-none py-2 px-3 h-full cursor-pointer flex items-center justify-center"
                  onClick={async (e) => {
                    e.preventDefault()
                    const currentCep = getValues("cep")
                    const { bairro, logradouro, localidade, uf, cep } = await fetch(
                      `https://viacep.com.br/ws/${currentCep}/json/`
                    )
                      .then((res) => res.json())
                      .catch(console.error)
                    setValue("endereco.logradouro", logradouro, { shouldValidate: true })
                    setValue("endereco.bairro", bairro, { shouldValidate: true })
                    setValue("endereco.cidade", localidade, { shouldValidate: true })
                    setValue("endereco.estado", uf, { shouldValidate: true })
                    setValue("cep", cep, { shouldValidate: true })
                  }}
                >
                  <MagnifyingGlassIcon width={20} height={20} />
                </button>
              </div>
              {errors.cep && <span className="font-medium text-xs self-start my-1">{errors.cep.message}</span>}
            </div>
            <div className="flex items-center justify-center w-full gap-2">
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="endereco-estado" title="Estado" className="self-start text-base font-medium">
                  Estado:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                      errors.endereco?.estado && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="endereco-estado"
                    maxLength={200}
                    placeholder="UF"
                    {...register("endereco.estado")}
                  />
                </div>
                {errors.endereco?.estado && (
                  <span className="font-medium text-xs self-start my-1">{errors.endereco?.estado.message}</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="endereco-cidade" title="Cidade" className="self-start text-base font-medium">
                  Cidade:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                      errors.endereco?.cidade && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="endereco-cidade"
                    maxLength={200}
                    placeholder="Cidade"
                    {...register("endereco.cidade")}
                  />
                </div>
                {errors.endereco?.cidade && (
                  <span className="font-medium text-xs self-start my-1">{errors.endereco?.cidade.message}</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="endereco-bairro" title="Bairro" className="self-start text-base font-medium">
                  Bairro:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                      errors.nome && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="endereco-bairro"
                    maxLength={200}
                    placeholder="Bairro"
                    {...register("endereco.bairro")}
                  />
                </div>
                {errors.endereco?.bairro && (
                  <span className="font-medium text-xs self-start my-1">{errors.endereco?.bairro.message}</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center w-full gap-2">
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="endereco-logradouro" title="Logradouro" className="self-start text-base font-medium">
                  Logradouro:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base px-3 rounded-md py-2 outline-none ${
                      errors.endereco?.logradouro && "border-2 rounded border-red-500"
                    }`}
                    type="text"
                    id="endereco-logradouro"
                    maxLength={200}
                    placeholder="Logradouro"
                    {...register("endereco.logradouro")}
                  />
                </div>
                {errors.endereco?.logradouro && (
                  <span className="font-medium text-xs self-start my-1">{errors.endereco?.logradouro.message}</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center grow">
                <label htmlFor="endereco-numero" title="Numero" className="self-start text-base font-medium">
                  Numero:
                </label>
                <div className="flex items-center w-full h-10">
                  <input
                    className={`bg-cinzero w-full h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                      errors.endereco?.numero && "border-2 rounded border-red-500"
                    }`}
                    type="number"
                    id="endereco-numero"
                    maxLength={200}
                    placeholder="Numero"
                    {...register("endereco.numero")}
                  />
                </div>
                {errors.endereco?.numero && (
                  <span className="font-medium text-xs self-start my-1">{errors.endereco?.numero.message}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="endereco-complemento" title="Complemento" className="self-start text-base font-medium">
                Complemento: <sup className="text-[10px] font-bold">(opcional)</sup>
              </label>
              <div className="flex items-center w-full h-10">
                <input
                  className={`bg-cinzero w-full h-10 font-medium text-base px-3 rounded-md py-2 outline-none ${
                    errors.endereco?.complemento && "border-2 rounded border-red-500"
                  }`}
                  type="text"
                  id="endereco-complemento"
                  maxLength={200}
                  placeholder="Complemento"
                  {...register("endereco.complemento")}
                />
              </div>
              {errors.endereco?.complemento && (
                <span className="font-medium text-xs self-start my-1">{errors.endereco?.complemento.message}</span>
              )}
            </div>
          </div>
        )}
        {formStep === 4 && (
          <div className="flex flex-col items-center justify-center gap-2 w-4/5 animate-transitionX">
            <div className="flex flex-col items-center justify-center w-full mt-6 gap-4">
              <label htmlFor="servicoPrincipal" title="Serviço principal" className="self-center text-xl font-medium">
                Qual o seu nicho?
              </label>
              <div className="flex items-center justify-center self-center w-full h-10">
                <select
                  className={`bg-cinzero w-3/5 self-center h-10 font-medium text-base rounded-md px-3 py-2 outline-none ${
                    errors.idServico && "border-2 rounded border-red-500"
                  }`}
                  id="servicoPrincipal"
                  {...register("idServico")}
                >
                  {servicos?.map((servico, index) => (
                    <option key={index} value={servico.id}>
                      {servico.nome}
                    </option>
                  ))}
                </select>
              </div>
              {errors.idServico && (
                <span className="font-medium text-xs self-start my-1 mx-auto">Selecione um serviço</span>
              )}
            </div>
          </div>
        )}
        <div className="w-4/5 flex items-center justify-between gap-4">
          {isSubmitting ? (
            <Button
              className="w-full flex mx-auto p-0 py-2 justify-center items-center animate-entranceButtonFadeIn"
              handleClick={() => toggleModal("Carregando... Aguarde um pouco")}
            >
              <LoadingSpinner size={10} />
            </Button>
          ) : (
            <>
              <Button
                className={`w-1/4 flex justify-center items-center py-2 px-4 mobile:w-4/12 ${
                  isSubmitting && "animate-exitButtonGrow"
                }`}
                handleClick={() => setFormStep((prevState) => (prevState === 1 ? 1 : prevState - 1))}
              >
                Anterior
              </Button>
              {!((userType === "CLIENTE" && formStep === 3) || (userType === "UZER" && formStep === 4)) ? (
                <button
                  type="submit"
                  className={`bg-azulao border-none rounded-lg text-white text-xl font-extrabold hover:bg-[#0f0f5c] w-1/4 flex justify-center items-center py-2 px-4 mobile:w-4/12 ${
                    isSubmitting && "animate-exitButtonGrow"
                  }`}
                  onClick={() => {
                    if (isFirstClick) return setIsFirstClick(false)
                    if (formStep === 1) {
                      if (errors.email || errors.nome) {
                        return toggleModal("Preencha os dados corretamente")
                      } else if (!userType) {
                        return toggleModal("Selecione um tipo de usuário")
                      } else setFormStep((prevState) => prevState + 1)
                    }
                    if (formStep === 2) {
                      if (
                        errors.telefone ||
                        errors.dataNascimento ||
                        errors.senha ||
                        errors.confirmarSenha ||
                        errors.cpf
                      ) {
                        return toggleModal("Preencha os dados corretamente")
                      }
                      if (validateConfirmarSenha()) return setFormStep((prevState) => prevState + 1)
                    }
                    if (formStep === 3) {
                      if (errors.cep || errors.endereco) {
                        return toggleModal("Preencha os dados corretamente")
                      }
                      if (userType === "CLIENTE") return
                      else return setFormStep((prevState) => prevState + 1)
                    }
                    if (formStep === 4) {
                      if (errors.idServico) {
                        return toggleModal("Preencha os dados corretamente")
                      }
                      return
                    }
                  }}
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  className={`bg-azulao border-none rounded-lg text-white text-xl font-extrabold hover:bg-[#0f0f5c] w-1/4 flex justify-center items-center py-2 px-4 mobile:w-4/12 ${
                    isSubmitting && "animate-exitButtonGrow"
                  }`}
                >
                  Finalizar
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {showModal && <Modal message={modalMessage} handleClick={() => setShowModal(false)} noButton={!haveButton} />}
    </form>
  )
}
