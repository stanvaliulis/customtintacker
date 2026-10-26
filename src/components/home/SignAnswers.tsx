import Container from '@/components/ui/Container';
import JsonLd from '@/components/seo/JsonLd';
import {getFAQSchema} from '@/lib/structured-data';
import {signAnswers} from '@/lib/seo/sign-answers';
export default function SignAnswers(){
 return <section aria-label="About tin tackers and proof review" className="bg-white py-12">
  <Container><h2 className="text-2xl font-bold text-gray-900">Tin tackers and proof review</h2>
   <div className="mt-6 space-y-6">{signAnswers.map(item=><div key={item.question}><h3 className="text-lg font-semibold text-gray-900">{item.question}</h3><p className="mt-2 max-w-3xl text-gray-700">{item.answer}</p></div>)}</div>
  </Container><JsonLd data={getFAQSchema(signAnswers)}/>
 </section>;
}
