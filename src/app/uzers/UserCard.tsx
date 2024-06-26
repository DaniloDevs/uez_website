"use client"

import Image from 'next/image'
import Link from 'next/link'
import { parseCookies } from 'nookies'
import React from 'react'
import { useFetch as myUseFetch } from '@/hooks/useFetch'
import Chat from '@/types/Chat'
import { useRouter } from 'next/navigation'
import sendNotification from '@/hooks/sendNotification'

interface UserFormData {
    nome: string
    servicoPrincipal: string
    photoUrl: string
    tipoServico: string
    _id: number
}

export default function UserCard({ nome = "Carregando...", servicoPrincipal = "Carregando...", photoUrl = "https://via.placeholder.com/150", tipoServico = "Carregando...", _id = 0 }: UserFormData) {
    const router = useRouter()
    return (
        <div className="w-[calc(50%_-_8px)] h-24 flex items-center justify-center bg-cinzero mobile:h-auto mobile:p-4 desktop:flex-col desktop:h-auto">
            <div className=" w-full h-full flex items-center justify-between py-2 px-4 mobile:flex-col mobile:justify-center mobile:gap-4 mobile:max-h-[420px] desktop:flex-col desktop:gap-4 desktop:py-8">
                <Image width={120} height={120} src={photoUrl} alt={nome} className="w-20 object-cover aspect-square rounded-full mobile:w-9/12 mobile:max-w-full" />
                <div className="flex flex-col items-center justify-center min-w-[40%]">
                    <h5 className="text-base font-medium text-gray-900 text-center mobile:w-[150%]">{nome}</h5>
                    <span className="text-xs text-gray-500 text-center mobile:w-[150%] mobile:text-xs">{servicoPrincipal}</span>
                    <span className="text-xs text-black text-center font-semibold mobile:w-[150%] mobile:text-xs">
                        {tipoServico.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 smmobile:flex-col">
                    <Link href={`/uzers/${_id}`} prefetch={false} className="w-1/2 flex items-center justify-center px-3 py-2 text-sm font-medium text-center text-white bg-azulao rounded-lg hover:bg-roxazul smmobile:w-full">Perfil</Link>
                    <button onClick={() => realizarServico(_id.toString())} className="w-1/2 flex items-center justify-center px-3 py-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-[#a9a9a9] smmobile:w-full">Contatar</button>
                </div>
            </div>
        </div>
    )

    function realizarServico(requestedContactId: string) {

        myUseFetch<Chat>(`/chat/create/${requestedContactId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${parseCookies().uezaccesstoken}`
            },
        })
            .then(async res => {
                await sendNotification("solicitCliente", `Cliente mandou mensagem para você!`, requestedContactId)
                router.push(`/chat?userChatId=${res._id}`)
            })
            .catch(err => console.error(err))


    }

}
