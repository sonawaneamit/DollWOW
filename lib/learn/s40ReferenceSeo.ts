import type {Metadata} from 'next';

export const s40ReferencePath='/heads/irontech-s40';
export const s40ReferenceUrl=`https://dollwow.com${s40ReferencePath}`;
export const s40ReferenceTitle='Irontech S40 Eileen Head: Factory Looks & Listed Builds';
export const s40ReferenceDescription='Explore Irontech S40 Eileen in five real factory looks, compare her listed body and material combinations, and try illustrative hair and eye looks in DollVue.';

export function s40ReferenceMetadata(environment:string|undefined):Metadata{
  return {
    title:s40ReferenceTitle,description:s40ReferenceDescription,
    alternates:{canonical:s40ReferencePath,types:{'text/markdown':`/markdown${s40ReferencePath}`}},
    robots:{index:environment==='production',follow:environment==='production'},
    openGraph:{type:'website',title:s40ReferenceTitle,description:s40ReferenceDescription,url:s40ReferenceUrl}
  };
}

export function s40ReferenceStructuredData(entries:{handle:string;name:string}[]){
  return [
    {'@context':'https://schema.org','@type':'CollectionPage','@id':s40ReferenceUrl,
      name:'Irontech S40: Eileen, Your Way',url:s40ReferenceUrl,inLanguage:'en-US',
      description:s40ReferenceDescription,about:{'@type':'Thing',name:'Irontech S40 Eileen head'},
      mainEntity:{'@type':'ItemList',numberOfItems:entries.length,itemListElement:entries.map((entry,index)=>({
        '@type':'ListItem',position:index+1,name:entry.name,url:`https://dollwow.com/products/${entry.handle}`
      }))}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:'https://dollwow.com/'},
      {'@type':'ListItem',position:2,name:'Irontech Dolls',item:'https://dollwow.com/brands/irontech-dolls'},
      {'@type':'ListItem',position:3,name:'Irontech S40 Eileen',item:s40ReferenceUrl}
    ]}
  ];
}
