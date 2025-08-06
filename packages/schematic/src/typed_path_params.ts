export type TypedPathParams<TPathParams extends string> = 
  TPathParams extends `:${infer ParamName}:${infer RestParams}`
    ? { [K in ParamName]: string } & TypedPathParams<`:${RestParams}`>
    : TPathParams extends `:${infer ParamName}`
      ? { [K in ParamName]: string }
      : {};
    

const typedParams1: TypedPathParams<':id'> = { 
  id: '', 
  //foo: 'bar' 
};
typedParams1.id

const typedParams2: TypedPathParams<':id:name'> = {
  id: '',
  name: ''
};
typedParams2.id
typedParams2.name

const typedParams3: TypedPathParams<':id:name:age'> = {
  id: '',
  name: '',
  age: ''
};
typedParams3.id
typedParams3.name
typedParams3.age